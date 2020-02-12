
echo "{"
s=""
for d in *; do
	echo $s
	echo -n '"'$d'"' ": ["
	w=''
	for f in $d/*.dsp; do
		echo -n $w '"'$f'"'
		w=','
	done
	echo -n "]"
	s=','
done
echo
echo "}"
